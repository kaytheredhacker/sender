/**
 * URL Encoder Routes
 * Handles API endpoints for URL encoding
 */
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const router = express.Router();

/**
 * Encode URL using HTML entities
 * @route POST /api/url-encoder/encode
 */
router.post('/encode', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }
    
    // Use the Python script to encode the URL
    const pythonProcess = spawn('python3', [
      path.join(process.cwd(), 'url_encoder.py')
    ]);
    
    let encodedUrl = '';
    let errorOutput = '';
    
    // Send the URL to the Python script
    pythonProcess.stdin.write(url);
    pythonProcess.stdin.end();
    
    // Collect the encoded URL from stdout
    pythonProcess.stdout.on('data', (data) => {
      encodedUrl += data.toString();
    });
    
    // Collect any error output
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({
          success: false,
          message: `URL encoding failed with code ${code}`,
          error: errorOutput
        });
      }
      
      res.json({
        success: true,
        originalUrl: url,
        encodedUrl: encodedUrl.trim()
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to encode URL: ${error.message}`
    });
  }
});

module.exports = router;
