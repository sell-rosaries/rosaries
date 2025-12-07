/**
 * FRESH EMAIL SERVICE - GOOGLE APPS SCRIPT
 * Simple, Clean, and Reliable
 * 
 * FEATURES:
 * ✅ Contact Form Support (New!)
 * ✅ Single Design Email Support
 * ✅ Gallery Email Support (up to 5 images)
 * ✅ Beautiful Email Templates
 * ✅ Automatic Request Detection
 * ✅ Error Handling
 * 
 * DEPLOYMENT:
 * 1. Create new Google Apps Script project
 * 2. Replace ALL code with this content
 * 3. Save and Deploy as Web App
 * 4. Copy the Web App URL to your rosary project
 */

function doPost(e) {
  try {
    console.log('=== WEB REQUEST RECEIVED ===');
    console.log('Raw request data:', e.postData.contents);
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed request data:', JSON.stringify(data, null, 2));
    
    // Extract customer information
    const name = data.name || 'Customer';
    const email = data.email || 'Not provided';
    const phone = data.phone || 'Not provided';
    const notes = data.notes || 'None';
    
    console.log('Customer Info:', { name, email, phone, notes });
    
    // Detect request type and process accordingly
    // 1. Explicit type check
    if (data.type === 'contact') {
        return handleContactRequest(data, email, notes);
    }

    // 2. Legacy detection (infer from data presence)
    if (data.selected_designs && data.selected_designs.length > 0) {
      // GALLERY REQUEST - Multiple images
      return handleGalleryRequest(data, name, email, phone, notes);
    } else {
      // SINGLE DESIGN REQUEST
      return handleSingleDesignRequest(data, name, email, phone, notes);
    }
    
  } catch (error) {
    console.error('=== ERROR IN doPost ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString(),
      error: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleContactRequest(data, email, notes) {
    console.log('Processing CONTACT request');
    const subject = `New Contact Message from ${email}`;
    const htmlBody = createContactEmailHTML(email, notes);

    try {
        MailApp.sendEmail({
            to: 'sell.rosaries@gmail.com',
            subject: subject,
            htmlBody: htmlBody
        });
        console.log('Contact email sent successfully');
        
        return ContentService.createTextOutput(JSON.stringify({
            success: true,
            message: 'Contact message sent successfully'
        })).setMimeType(ContentService.MimeType.JSON);
        
    } catch (error) {
        throw new Error('Contact email failed: ' + error.toString());
    }
}

function handleSingleDesignRequest(data, name, email, phone, notes) {
  console.log('Processing SINGLE DESIGN request');

  // Get design data
  const designImage = data.design_image;
  if (!designImage) {
    // If we fell through to here but have no image, it might be a malformed contact request?
    // But let's throw friendly error
    throw new Error('No design image provided for design request');
  }
  
  // Create email content
  const subject = `New Rosary Design Request - ${name}`;
  const htmlBody = createSingleDesignEmailHTML(name, email, phone, notes, data);
  
  // Process image
  const imageBytes = Utilities.base64Decode(designImage.split(',')[1]);
  const imageBlob = Utilities.newBlob(imageBytes, 'image/jpeg', 'rosary-design.jpg');
  
  // Send email
  MailApp.sendEmail({
      to: 'sell.rosaries@gmail.com',
      subject: subject,
      htmlBody: htmlBody,
      attachments: [imageBlob]
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Single design email sent successfully',
    requestType: 'single-design'
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleGalleryRequest(data, name, email, phone, notes) {
  console.log('Processing GALLERY request');
  
  const designs = data.selected_designs;
  const limitedDesigns = designs.slice(0, 5);
  
  const subject = `Gallery Selection - ${limitedDesigns.length} Designs - ${name}`;
  const htmlBody = createGalleryEmailHTML(name, email, phone, notes, data, limitedDesigns);
  
  const attachments = [];
  limitedDesigns.forEach((design, index) => {
    if (design.image_data) {
      try {
        const imageBytes = Utilities.base64Decode(design.image_data.split(',')[1]);
        const imageBlob = Utilities.newBlob(imageBytes, 'image/jpeg', `gallery-design-${index + 1}.jpg`);
        attachments.push(imageBlob);
      } catch (error) {
        console.error(`Error processing image ${index + 1}:`, error);
      }
    }
  });
  
  MailApp.sendEmail({
      to: 'sell.rosaries@gmail.com',
      subject: subject,
      htmlBody: htmlBody,
      attachments: attachments
  });
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Gallery email sent successfully',
    requestType: 'gallery'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ================= TEMPLATES =================

function createContactEmailHTML(email, message) {
    return `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2c5aa0;">New Contact Message</h2>
        <p><strong>From:</strong> ${email}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">Sent from Rosary App Contact Form</p>
    </div>
    `;
}

function createSingleDesignEmailHTML(name, email, phone, notes, data) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: sans-serif; margin: 0; padding: 20px; background: #f0f2f5; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; }
      .header { text-align: center; margin-bottom: 30px; }
      .section { margin-bottom: 20px; background: #f8f9fa; padding: 15px; border-radius: 5px; }
      .label { font-weight: bold; color: #555; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="color: #8B4513;">New Design Request</h1>
      </div>
      <div class="section">
        <p><span class="label">Name:</span> ${name}</p>
        <p><span class="label">Email:</span> ${email}</p>
        <p><span class="label">Phone:</span> ${phone}</p>
      </div>
      <div class="section">
        <h3>Additional Notes</h3>
        <p>${notes}</p>
      </div>
      <div class="section" style="background: #e8f5e8;">
         <p>📎 Image attached: rosary-design.jpg</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

function createGalleryEmailHTML(name, email, phone, notes, data, designs) {
  const designsList = designs.map((d, i) => `<li>${d.title || 'Design ' + (i+1)}</li>`).join('');
  
  return `
  <!DOCTYPE html>
  <html>
  <body>
    <div style="font-family: sans-serif; padding: 20px;">
      <h1 style="color: #8B4513;">Gallery Selection</h1>
      <p><strong>Customer:</strong> ${name} (${email})</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <h3>Selected Designs (${designs.length}):</h3>
      <ul>${designsList}</ul>
      <h3>Notes:</h3>
      <p>${notes}</p>
    </div>
  </body>
  </html>
  `;
}