"use server";

interface TicketData {
  id: string;
  date: string;
  hours: number;
  location: string;
  total_cost: number;
  email: string;
  phone?: string;
  customerName?: string;
  token: string;
}

export async function sendTicket(data: TicketData) {
  // Verify user authorization via the passed access token
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(data.token);
  
  if (authError || !user) {
    console.error("❌ SendTicket Error: Unauthorized invocation attempt.");
    return { success: false, error: "Unauthorized request" };
  }

  // Move Node-only imports inside the server action
  const nodemailer = (await import("nodemailer")).default;
  const { jsPDF } = await import("jspdf");
  const QRCode = (await import("qrcode")).default;
  const { format, parse } = await import("date-fns");

  // Format ID and Date for display (Robust parsing)
  const displayId = data.id.substring(0, 8).toUpperCase();
  
  let parsedDate: Date;
  try {
    if (data.date.includes("-") && data.date.split("-")[0].length === 4) {
      parsedDate = parse(data.date, "yyyy-MM-dd", new Date());
    } else {
      parsedDate = parse(data.date, "dd-MM-yyyy", new Date());
    }
  } catch {
    parsedDate = new Date(data.date);
  }
  
  const emailDate = format(parsedDate, "d MMMM yyyy");

  // Initialize Nodemailer transporter with explicit Gmail SMTP config
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ SendTicket Error: EMAIL_USER or EMAIL_PASS is not defined in environment variables.");
    return { success: false, error: "Missing email credentials" };
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const locationData: Record<string, { address: string; query: string }> = {
    "Eco Park": {
      address: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161",
      query: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161"
    },
    "Eco Park Newtown": {
      address: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161",
      query: "Major Arterial Road(South-East, Biswa Bangla Sarani, AA II, Newtown, Kolkata, West Bengal 700161"
    },
    "Indian Museum": {
      address: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016",
      query: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016"
    },
    "Indian Museum, Kolkata": {
      address: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016",
      query: "27, Jawaharlal Nehru Rd, Fire Brigade Head Quarter, New Market Area, Dharmatala, Taltala, Kolkata, West Bengal 700016"
    }
  };

  const mapsQuery = locationData[data.location]?.query || (data.location + " Kolkata");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  try {
    // 1. Generate QR Code (Uses FULL ID for uniqueness)
    const qrData = JSON.stringify({
      ticketId: data.id,
      unlockCode: process.env.NEXT_PUBLIC_UNLOCK_CODE || "UNLOCK-772"
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });

    // 2. Generate PDF using jsPDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 180] 
    });

    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background - Dark Mode
    doc.setFillColor(5, 5, 5); 
    doc.rect(0, 0, width, height, "F");

    // Top Section - Gradient Effect
    for (let i = 0; i < 40; i++) {
        const opacity = 0.15 * (1 - i / 40);
        doc.setFillColor(74, 144, 226); 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        doc.setGState(new (doc as any).GState({ opacity: opacity }));
        doc.rect(0, i, width, 1, "F");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.setGState(new (doc as any).GState({ opacity: 1 }));

    // Header - Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("THE ULTRON", width / 2, 15, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("ROBOTIC TOUR SERVICES", width / 2, 20, { align: "center" });
    
    // Status Badge & Checkmark 
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.5);
    doc.circle(width / 2, 32, 6, "S"); 
    doc.setLineWidth(0.8);
    doc.line(width / 2 - 2.5, 32, width / 2 - 0.5, 34);
    doc.line(width / 2 - 0.5, 34, width / 2 + 3, 30);

    doc.setTextColor(34, 197, 94);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BOOKING CONFIRMED", width / 2, 44, { align: "center" });

    // Ticket Card
    const cardMargin = 10;
    const cardWidth = width - (cardMargin * 2);
    const cardY = 50;
    const cardHeight = 110; 
    doc.setFillColor(20, 20, 20);
    doc.setDrawColor(255, 255, 255, 0.05);
    doc.roundedRect(cardMargin, cardY, cardWidth, cardHeight, 4, 4, "FD");

    // Confirmation ID Section
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("TICKET ID", cardMargin + 10, cardY + 10);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("courier", "bold");
    doc.text(displayId, cardMargin + 10, cardY + 18);

    // Separator line
    doc.setDrawColor(255, 255, 255, 0.03);
    doc.line(cardMargin + 5, cardY + 24, width - cardMargin - 5, cardY + 24);

    // Traveler Info
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("TRAVELER", cardMargin + 10, cardY + 32);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(data.customerName || "Valued Customer", cardMargin + 10, cardY + 38);

    // Grid Info
    const col2 = cardMargin + (cardWidth / 2) + 5;
    
    // Date & Duration
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("DATE", cardMargin + 10, cardY + 48);
    doc.text("DURATION", col2, cardY + 48);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(emailDate, cardMargin + 10, cardY + 53); // Updated date format
    doc.text(`${data.hours} Hours`, col2, cardY + 53);

    // Location
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("LOCATION", cardMargin + 10, cardY + 63);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(data.location, cardMargin + 10, cardY + 68);

    // Google Maps Link Button in PDF
    const mapsBtnX = cardMargin + 10 + doc.getTextWidth(data.location) + 5;
    const mapsBtnY = cardY + 64.5;
    const mapsBtnW = 18;
    const mapsBtnH = 5;

    doc.setFillColor(30, 30, 30);
    doc.roundedRect(mapsBtnX, mapsBtnY, mapsBtnW, mapsBtnH, 1, 1, "F");
    doc.setTextColor(74, 144, 226);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text("GOOGLE MAPS", mapsBtnX + mapsBtnW / 2, mapsBtnY + 3.5, { align: "center" });
    
    // Clickable hotspot
    doc.link(mapsBtnX, mapsBtnY, mapsBtnW, mapsBtnH, { url: mapsUrl });

    // QR Code Section 
    const qrSize = 24;
    const qrY = cardY + 75;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(width / 2 - (qrSize/2 + 2), qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "F");
    doc.addImage(qrCodeDataUrl, "PNG", width / 2 - (qrSize/2), qrY, qrSize, qrSize);

    // Amount at bottom of card
    doc.setTextColor(74, 144, 226);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: INR ${data.total_cost}`, width / 2, qrY + qrSize + 8, { align: "center" });

    // Footer Info
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("PLEASE PRESENT THIS QR AT THE STATION TERMINAL", width / 2, 168, { align: "center" });
    doc.text("© 2026 THE ULTRON ROBOTICS. ALL RIGHTS RESERVED.", width / 2, 171, { align: "center" });

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // 3. Send Email via Nodemailer
    const fromEmail = process.env.EMAIL_USER?.trim();
    
    const mailOptions = {
      from: `"Friday from The Ultron" <${fromEmail}>`,
      replyTo: fromEmail,
      to: data.email,
      subject: `Trip Details: Your journey with The Ultron is ready! (${displayId})`,
      text: `Hi ${data.customerName || "there"},\n\nI'm Friday, your Ultron assistant. I've prepared your digital trip pass for our upcoming journey!\n\nTicket ID: ${displayId}\nLocation: ${data.location}\nDate: ${emailDate}\nDuration: ${data.hours} Hours\n\nGoogle Maps Location:\n${mapsUrl}\n\nI've attached your pass as a PDF. Safe travels!\n\nSee you soon,\nFriday & The Ultron Team`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media only screen and (max-width: 480px) {
              .content-padding { padding: 20px !important; }
              .header-text { font-size: 22px !important; }
              .card-padding { padding: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000;">
            <tr>
              <td align="center" style="padding: 40px 10px;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #050505; border-radius: 32px; border: 1px solid #1a1a1a;">
                  <!-- Brand Header -->
                  <tr>
                    <td align="center" class="content-padding" style="padding: 45px 30px 25px 30px;">
                      <h1 class="header-text" style="color: #4A90E2; margin: 0 0 8px 0; font-weight: 900; letter-spacing: 4px; font-size: 28px; text-transform: uppercase;">THE ULTRON</h1>
                      <p style="color: #666; font-size: 10px; margin: 0; letter-spacing: 2px; text-transform: uppercase; font-weight: 600;">Next-Gen Robotic Tour Services</p>
                    </td>
                  </tr>
                  
                  <!-- Main Content Card -->
                  <tr>
                    <td style="padding: 0 25px 40px 25px;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f0f0f; border: 1px solid #222; border-radius: 24px;">
                        <tr>
                          <td class="card-padding" style="padding: 40px 30px;">
                            <!-- Status Header -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                              <tr>
                                <td align="center">
                                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td align="center" style="width: 42px; height: 42px; background-color: #0d2e1c; border: 1px solid #22c55e; border-radius: 21px;">
                                        <span style="color: #22c55e; font-size: 22px; line-height: 42px; font-weight: bold;">✓</span>
                                      </td>
                                      <td style="padding-left: 15px;">
                                        <h2 style="color: #ffffff; font-size: 20px; margin: 0; font-weight: 700; white-space: nowrap;">Booking Confirmed!</h2>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>

                            <p style="color: #ccc; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                              Greetings, <strong>${data.customerName || 'Explorer'}</strong>. Your reservation with The Ultron is finalized.
                            </p>
                            
                            <!-- Trip Details Grid -->
                            <div style="background-color: #161616; border: 1px solid #222; border-radius: 20px; padding: 25px;">
                              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                  <td colspan="2" style="padding-bottom: 20px; border-bottom: 1px solid #222;">
                                    <span style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px; font-weight: 700;">Ticket ID</span>
                                    <strong style="color: #4A90E2; font-family: 'Courier New', Courier, monospace; font-size: 18px; letter-spacing: 1px;">${displayId}</strong>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="width: 50%; padding: 20px 10px 15px 0; vertical-align: top;">
                                    <span style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px; font-weight: 700;">Location</span>
                                    <strong style="color: #fff; font-size: 13px;">${data.location}</strong>
                                  </td>
                                  <td style="width: 50%; padding: 20px 0 15px 10px; vertical-align: top;">
                                    <span style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px; font-weight: 700;">Date</span>
                                    <strong style="color: #fff; font-size: 13px;">${emailDate}</strong>
                                  </td>
                                </tr>
                                <tr>
                                  <td style="width: 50%; padding-top: 5px; vertical-align: top;">
                                    <span style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px; font-weight: 700;">Duration</span>
                                    <strong style="color: #fff; font-size: 13px;">${data.hours} Hour${data.hours > 1 ? 's' : ''}</strong>
                                  </td>
                                  <td style="width: 50%; padding-top: 5px; vertical-align: top;">
                                    <span style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px; font-weight: 700;">Paid</span>
                                    <strong style="color: #fff; font-size: 13px;">INR ${data.total_cost}</strong>
                                  </td>
                                </tr>
                              </table>
                            </div>

                            <!-- Google Maps Button -->
                            <div style="margin-top: 25px;">
                              <a href="${mapsUrl}" target="_blank" style="display: block; background-color: #1a1a1a; border: 1px solid #333; color: #4A90E2; text-align: center; padding: 14px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                                📍 Open in Google Maps
                              </a>
                            </div>

                            <p style="color: #666; font-size: 11px; font-style: italic; text-align: center; margin: 30px 0 0 0;">
                              PDF Trip Pass attached. Scan QR at terminal.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="padding: 0 20px 45px 20px;">
                      <p style="color: #333; font-size: 9px; letter-spacing: 1px; margin: 0; text-transform: uppercase; font-weight: 600;">
                        © 2026 THE ULTRON ROBOTICS. ALL RIGHTS RESERVED.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,

      attachments: [
        {
          filename: `Ultron_Pass_${displayId}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("SendTicket Server Action Error:", error);
    return { success: false, error: "Failed to send ticket" };
  }
}
