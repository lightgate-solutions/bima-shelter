import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = process.env.RESEND_SENDER_EMAIL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, title, severity, description, stepsToReproduce } =
      body;

    const severityColors: Record<string, string> = {
      low: "#22c55e",
      medium: "#f59e0b",
      high: "#f97316",
      critical: "#ef4444",
    };

    const { error } = await resend.emails.send({
      from: `BIMA Shelter <${sendEmail}>`,
      to: [
        "elameendaiyabu@gmail.com",
        "ibrahimhsalman5@gmail.com",
        "sulaymancodes@gmail.com",
        "khaleefasabo@gmail.com",
        "mahmoodsaadiq@gmail.com",
      ],
      subject: `[${severity.toUpperCase()}] Bug Report: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Bug Report</h2>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Reporter Information</h3>
            <p style="margin: 4px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${email}</p>
          </div>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Bug Details</h3>
            <p style="margin: 4px 0;"><strong>Title:</strong> ${title}</p>
            <p style="margin: 4px 0;">
              <strong>Severity:</strong>
              <span style="background-color: ${severityColors[severity]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                ${severity.toUpperCase()}
              </span>
            </p>
          </div>

          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Description</h3>
            <p style="margin: 4px 0; white-space: pre-wrap;">${description}</p>
          </div>

          ${
            stepsToReproduce
              ? `
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0; color: #374151;">Steps to Reproduce</h3>
            <p style="margin: 4px 0; white-space: pre-wrap;">${stepsToReproduce}</p>
          </div>
          `
              : ""
          }

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #6b7280; font-size: 12px;">
            This bug report was submitted from BIMA Shelters application.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bug report error:", error);
    return NextResponse.json(
      { error: "Failed to process bug report" },
      { status: 500 },
    );
  }
}
