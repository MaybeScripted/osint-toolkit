const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class DocumentAnalysisService {
  constructor() {
    this.supportedFormats = {
      // Stupid images
      'image/jpeg': { extension: 'jpg', category: 'image' },
      'image/png': { extension: 'png', category: 'image' },
      'image/gif': { extension: 'gif', category: 'image' },
      'image/bmp': { extension: 'bmp', category: 'image' },
      'image/tiff': { extension: 'tiff', category: 'image' },
      'image/webp': { extension: 'webp', category: 'image' },
      'image/svg+xml': { extension: 'svg', category: 'image' },
      
      // random documents
      'application/pdf': { extension: 'pdf', category: 'document' },
      'application/msword': { extension: 'doc', category: 'document' },
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', category: 'document' },
      'application/vnd.ms-excel': { extension: 'xls', category: 'document' },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', category: 'document' },
      'application/vnd.ms-powerpoint': { extension: 'ppt', category: 'document' },
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': { extension: 'pptx', category: 'document' },
      'text/plain': { extension: 'txt', category: 'document' },
      'text/html': { extension: 'html', category: 'document' },
      'text/xml': { extension: 'xml', category: 'document' },
      'application/xml': { extension: 'xml', category: 'document' },
      'application/json': { extension: 'json', category: 'document' },
      'application/rtf': { extension: 'rtf', category: 'document' },
      
      // funny audio
      'audio/mpeg': { extension: 'mp3', category: 'audio' },
      'audio/wav': { extension: 'wav', category: 'audio' },
      'audio/ogg': { extension: 'ogg', category: 'audio' },
      'audio/mp4': { extension: 'm4a', category: 'audio' },
      'audio/aac': { extension: 'aac', category: 'audio' },
      'audio/flac': { extension: 'flac', category: 'audio' },
      
      // tiktok edits (videos)
      'video/mp4': { extension: 'mp4', category: 'video' },
      'video/avi': { extension: 'avi', category: 'video' },
      'video/mov': { extension: 'mov', category: 'video' },
      'video/wmv': { extension: 'wmv', category: 'video' },
      'video/flv': { extension: 'flv', category: 'video' },
      'video/webm': { extension: 'webm', category: 'video' },
      'video/quicktime': { extension: 'mov', category: 'video' },
      
      // archives
      'application/zip': { extension: 'zip', category: 'archive' },
      'application/x-rar-compressed': { extension: 'rar', category: 'archive' },
      'application/x-7z-compressed': { extension: '7z', category: 'archive' },
      'application/gzip': { extension: 'gz', category: 'archive' },
      'application/x-tar': { extension: 'tar', category: 'archive' },
      
      // and whatever else, aka other
      'application/octet-stream': { extension: 'bin', category: 'binary' }
    };
  }

  async analyzeDocument(fileBuffer, filename, mimeType) {
    try {
      // Create temporary file
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `doc_analysis_${Date.now()}_${filename}`);
      
      // Write buffer to temporary file
      fs.writeFileSync(tempFilePath, fileBuffer);
      
      try {
        // extracting metadata using python script. cuz i know python. 
        const metadata = await this.extractMetadataPython(tempFilePath);
        
        const fileInfo = this.getFileInfo(fileBuffer, filename, mimeType);
        
        // combining metadata with file info
        const analysis = {
          ...fileInfo,
          metadata: metadata,
          analysis: this.analyzeMetadata(metadata, fileInfo),
          timestamp: new Date().toISOString()
        };
        
        return {
          success: true,
          data: analysis
        };
        
      } finally {
        // cleaning up the temporary file because we dont need it anymore
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
      
    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to analyze document',
          details: error.message
        }
      };
    }
  }

  async extractMetadataPython(filePath) {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import sys
import json
import os
import mimetypes
from datetime import datetime

def extract_basic_metadata(file_path):
    """Extract basic file metadata without external dependencies"""
    try:
        result = {}
        
        # Basic file stats
        stat = os.stat(file_path)
        result['file_size'] = stat.st_size
        result['created_time'] = datetime.fromtimestamp(stat.st_ctime).isoformat()
        result['modified_time'] = datetime.fromtimestamp(stat.st_mtime).isoformat()
        result['accessed_time'] = datetime.fromtimestamp(stat.st_atime).isoformat()
        
        # MIME type
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type:
            result['mime_type'] = mime_type
        
        # File extension
        _, ext = os.path.splitext(file_path)
        if ext:
            result['file_extension'] = ext.lower()
        
        # Check if it's an image file
        is_image = mime_type and mime_type.startswith('image/')
        
        # Try to extract EXIF data for images
        if is_image:
            try:
                from PIL import Image
                from PIL.ExifTags import TAGS
                
                with Image.open(file_path) as img:
                    result['image_width'] = img.width
                    result['image_height'] = img.height
                    result['image_mode'] = img.mode
                    result['image_format'] = img.format
                    
                    # Extract EXIF data
                    exifdata = img.getexif()
                    if exifdata:
                        for tag_id, value in exifdata.items():
                            tag = TAGS.get(tag_id, tag_id)
                            if isinstance(tag, str) and isinstance(value, (str, int, float)):
                                clean_tag = tag.lower().replace(' ', '_').replace('-', '_')
                                result[f'exif_{clean_tag}'] = str(value)
                                
            except ImportError:
                # PIL not available, skip image processing
                result['image_error'] = 'PIL not available'
            except Exception as e:
                # Not an image or other error
                result['image_error'] = str(e)
        
        # Try to extract basic text file info (only for text files)
        if not is_image and mime_type and mime_type.startswith('text/'):
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read(1024)  # Read first 1KB
                    result['text_preview'] = content[:200]  # First 200 chars
                    result['text_length'] = len(content)
            except:
                # Encoding issues
                pass
        
        return result
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    file_path = sys.argv[1]
    result = extract_basic_metadata(file_path)
    print(json.dumps(result, indent=2))
`;

      const tempScriptPath = path.join(os.tmpdir(), `metadata_extractor_${Date.now()}.py`);
      fs.writeFileSync(tempScriptPath, pythonScript);

      const pythonProcess = spawn('python3', [tempScriptPath, filePath]);
      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        // cleaning up the temp script. dont need it anymore.
        if (fs.existsSync(tempScriptPath)) {
          fs.unlinkSync(tempScriptPath);
        }

        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
          return;
        }

        try {
          const metadata = JSON.parse(output);
          resolve(metadata);
        } catch (parseError) {
          reject(new Error(`Failed to parse metadata output: ${parseError.message}`));
        }
      });

      pythonProcess.on('error', (error) => {
        // Clean up temp script
        if (fs.existsSync(tempScriptPath)) {
          fs.unlinkSync(tempScriptPath);
        }
        reject(error);
      });
    });
  }

  getFileInfo(fileBuffer, filename, mimeType) {
    const fileSize = fileBuffer.length;
    const fileExtension = path.extname(filename).toLowerCase().slice(1);
    const formatInfo = this.supportedFormats[mimeType] || { extension: fileExtension, category: 'unknown' };
    
    return {
      filename: filename,
      size: fileSize,
      sizeFormatted: this.formatFileSize(fileSize),
      mimeType: mimeType,
      extension: fileExtension,
      category: formatInfo.category,
      isSupported: !!this.supportedFormats[mimeType]
    };
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  analyzeMetadata(metadata, fileInfo) {
    const analysis = {
      hasMetadata: Object.keys(metadata).length > 0,
      metadataCount: Object.keys(metadata).length,
      categories: this.categorizeMetadata(metadata),
      security: this.analyzeSecurity(metadata, fileInfo),
      insights: this.generateInsights(metadata, fileInfo),
      warnings: this.generateWarnings(metadata, fileInfo)
    };

    return analysis;
  }

  categorizeMetadata(metadata) {
    const categories = {
      basic: {},
      technical: {},
      creation: {},
      location: {},
      software: {},
      security: {},
      other: {}
    };

    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      
      if (lowerKey.includes('width') || lowerKey.includes('height') || 
          lowerKey.includes('resolution') || lowerKey.includes('dimension') ||
          lowerKey.includes('image_width') || lowerKey.includes('image_height') ||
          lowerKey.includes('image_mode') || lowerKey.includes('image_format')) {
        categories.technical[key] = value;
      } else if (lowerKey.includes('created') || lowerKey.includes('date') || 
                 lowerKey.includes('time') || lowerKey.includes('timestamp') ||
                 lowerKey.includes('created_time') || lowerKey.includes('modified_time') ||
                 lowerKey.includes('accessed_time')) {
        categories.creation[key] = value;
      } else if (lowerKey.includes('location') || lowerKey.includes('gps') || 
                 lowerKey.includes('latitude') || lowerKey.includes('longitude') || 
                 lowerKey.includes('country') || lowerKey.includes('city') ||
                 lowerKey.includes('exif_gps')) {
        categories.location[key] = value;
      } else if (lowerKey.includes('software') || lowerKey.includes('program') || 
                 lowerKey.includes('application') || lowerKey.includes('camera') || 
                 lowerKey.includes('device') || lowerKey.includes('exif_make') ||
                 lowerKey.includes('exif_model') || lowerKey.includes('exif_software')) {
        categories.software[key] = value;
      } else if (lowerKey.includes('encryption') || lowerKey.includes('password') || 
                 lowerKey.includes('security') || lowerKey.includes('permission')) {
        categories.security[key] = value;
      } else if (lowerKey.includes('title') || lowerKey.includes('author') || 
                 lowerKey.includes('subject') || lowerKey.includes('description') || 
                 lowerKey.includes('comment') || lowerKey.includes('exif_artist') ||
                 lowerKey.includes('exif_copyright')) {
        categories.basic[key] = value;
      } else if (lowerKey.startsWith('exif_')) {
        // All other EXIF data goes to technical
        categories.technical[key] = value;
      } else if (lowerKey.includes('text_preview') || lowerKey.includes('text_length')) {
        // Text content goes to basic info
        categories.basic[key] = value;
      } else {
        categories.other[key] = value;
      }
    }

    return categories;
  }

  analyzeSecurity(metadata, fileInfo) {
    const security = {
      level: 'unknown',
      concerns: [],
      recommendations: []
    };

    // location data area
    const hasLocation = Object.keys(metadata).some(key => 
      key.toLowerCase().includes('gps') || 
      key.toLowerCase().includes('latitude') || 
      key.toLowerCase().includes('longitude') ||
      key.toLowerCase().includes('location')
    );

    if (hasLocation) {
      security.concerns.push('Contains location/GPS data');
      security.recommendations.push('Consider removing location data before sharing');
    }

    // software/device information shit
    const hasSoftwareInfo = Object.keys(metadata).some(key => 
      key.toLowerCase().includes('software') || 
      key.toLowerCase().includes('camera') || 
      key.toLowerCase().includes('device')
    );

    if (hasSoftwareInfo) {
      security.concerns.push('Contains software/device information');
    }

    // creation details - be more specific about what's concerning
    const hasExifCreationDetails = Object.keys(metadata).some(key => 
      key.toLowerCase().startsWith('exif_') && (
        key.toLowerCase().includes('created') || 
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('datetime')
      )
    );

    if (hasExifCreationDetails) {
      security.concerns.push('Contains EXIF creation timestamp information');
    }

    // security level stuff
    if (security.concerns.length === 0) {
      security.level = 'low';
    } else if (security.concerns.length <= 2) {
      security.level = 'medium';
    } else {
      security.level = 'high';
    }

    return security;
  }

  generateInsights(metadata, fileInfo) {
    const insights = [];

    // file insights
    if (fileInfo.category === 'image') {
      insights.push('This is an image file');
      
      if (metadata.image_width && metadata.image_height) {
        insights.push(`Image dimensions: ${metadata.image_width}x${metadata.image_height} pixels`);
      }
      
      if (metadata.image_mode) {
        insights.push(`Color mode: ${metadata.image_mode}`);
      }
      
      if (metadata.image_format) {
        insights.push(`Format: ${metadata.image_format}`);
      }
      
      // checking for exif data because its important
      const exifCount = Object.keys(metadata).filter(key => key.startsWith('exif_')).length;
      if (exifCount > 0) {
        insights.push(`Contains ${exifCount} EXIF metadata fields`);
      }
    }

    if (fileInfo.category === 'document') {
      insights.push('This is a document file');
      
      if (metadata.page_count) {
        insights.push(`Document has ${metadata.page_count} pages`);
      }
      
      if (metadata.author) {
        insights.push(`Author: ${metadata.author}`);
      }
    }

    if (fileInfo.category === 'video') {
      insights.push('This is a video file');
      
      if (metadata.duration) {
        insights.push(`Duration: ${metadata.duration}`);
      }
      
      if (metadata.frame_rate) {
        insights.push(`Frame rate: ${metadata.frame_rate} fps`);
      }
    }

    if (fileInfo.category === 'audio') {
      insights.push('This is an audio file');
      
      if (metadata.duration) {
        insights.push(`Duration: ${metadata.duration}`);
      }
      
      if (metadata.sample_rate) {
        insights.push(`Sample rate: ${metadata.sample_rate} Hz`);
      }
    }

    // "when was this file created" insights
    if (metadata.creation_date) {
      insights.push(`Created: ${metadata.creation_date}`);
    }

    if (metadata.software) {
      insights.push(`Created with: ${metadata.software}`);
    }

    // where the fuck was this file created
    if (metadata.gps_latitude && metadata.gps_longitude) {
      insights.push(`Contains GPS coordinates: ${metadata.gps_latitude}, ${metadata.gps_longitude}`);
    }

    return insights;
  }

  generateWarnings(metadata, fileInfo) {
    const warnings = [];

    // potentially sensitive information
    const sensitiveFields = ['author', 'creator', 'producer', 'title', 'subject'];
    const hasSensitiveInfo = sensitiveFields.some(field => metadata[field]);
    
    if (hasSensitiveInfo) {
      warnings.push('Document contains potentially identifying information');
    }

    // location data :D
    const hasLocation = Object.keys(metadata).some(key => 
      key.toLowerCase().includes('gps') || 
      key.toLowerCase().includes('latitude') || 
      key.toLowerCase().includes('longitude')
    );

    if (hasLocation) {
      warnings.push('Document contains location data - consider privacy implications');
    }

    // checking file size
    if (fileInfo.size > 50 * 1024 * 1024) { // 50MB
      warnings.push('Large file size may indicate high resolution or complex content');
    }

    return warnings;
  }

  getSupportedFormats() {
    return this.supportedFormats;
  }

  isFormatSupported(mimeType) {
    return !!this.supportedFormats[mimeType];
  }
}

module.exports = new DocumentAnalysisService();
