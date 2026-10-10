package com.phangwilly.portfolio.service;

import com.phangwilly.portfolio.model.Contact;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

@Component
public class ContactReplyEmailFactory {

  private final String appTitle;
  private final DateTimeFormatter dateFormat;

  public ContactReplyEmailFactory(
    @Value("${app.title:Portfolio}") String appTitle,
    @Value("${app.email.time-zone:Europe/Paris}") String timeZone
  ) {
    this.appTitle = singleLine(appTitle == null || appTitle.isBlank() ? "Portfolio" : appTitle);
    this.dateFormat = DateTimeFormatter.ofPattern("d MMMM yyyy 'à' HH:mm z", Locale.FRENCH)
      .withZone(ZoneId.of(timeZone));
  }

  public EmailMessage create(Contact contact, String reply) {
    String subject = appTitle + " - SUITE : " + singleLine(contact.getSubject());
    String requestedAt = dateFormat.format(contact.getCreatedAt());
    String details = detailRow("Prénom", contact.getFirstname())
      + detailRow("Nom", contact.getLastname())
      + detailRow("Email", contact.getEmail())
      + detailRow("Téléphone", contact.getPhone())
      + detailRow("Entreprise", contact.getCompany())
      + detailRow("Objet", contact.getSubject())
      + detailRow("Message", contact.getMessage(), true);

    String body = """
      <!doctype html>
      <html lang="fr">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" style="width:100%%;border-collapse:collapse;background:#f1f5f9;">
            <tr><td align="center" style="padding:32px 12px;">
              <table role="presentation" style="width:100%%;max-width:640px;border-collapse:collapse;background:#ffffff;">
                <tr><td style="padding:28px 32px;background:#0f172a;border-bottom:4px solid #14b8a6;">
                  <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;">%s</p>
                  <p style="margin:8px 0 0;font-size:12px;letter-spacing:2px;color:#cbd5e1;">VOTRE DEMANDE DE CONTACT</p>
                </td></tr>
                <tr><td style="padding:32px;overflow-wrap:anywhere;word-break:break-word;">
                  <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;">Suite à votre demande</h1>
                  <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#475569;">Nous faisons suite à votre demande de contact du %s.</p>
                  <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">Bonjour %s,</p>
                  <div style="font-size:16px;line-height:1.7;">%s</div>
                  <p style="margin:24px 0 0;font-size:14px;line-height:1.6;">Cordialement,<br><strong>%s</strong></p>
                </td></tr>
                <tr><td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;overflow-wrap:anywhere;word-break:break-word;">
                  <h2 style="margin:0 0 16px;font-size:16px;">Rappel de votre demande</h2>
                  <table style="width:100%%;border-collapse:collapse;font-size:13px;line-height:1.6;">%s</table>
                </td></tr>
                <tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.6;color:#64748b;">
                  Ce message vous est adressé en réponse à votre demande de contact auprès de %s.
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
      """.formatted(
        escape(appTitle), escape(requestedAt), escape(contact.getFirstname()), multiline(reply),
        escape(appTitle), details, escape(appTitle)
      );

    return new EmailMessage(contact.getEmail(), subject, body, true);
  }

  private static String detailRow(String label, String value) {
    return detailRow(label, value, false);
  }

  private static String detailRow(String label, String value, boolean preserveLines) {
    String content = value == null || value.isBlank() ? "Non renseigné" : value;
    String rendered = preserveLines ? multiline(content) : escape(content);
    return "<tr><td style=\"padding:10px 0;overflow-wrap:anywhere;word-break:break-word;\">"
      + "<p style=\"margin:0 0 2px;font-size:13px;font-weight:bold;color:#0f172a;\">" + escape(label) + "</p>"
      + "<p style=\"margin:0;font-size:14px;font-weight:normal;line-height:1.6;color:#334155;\">" + rendered + "</p>"
      + "</td></tr>";
  }

  private static String multiline(String value) {
    return escape(value).replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br>");
  }

  private static String escape(String value) {
    return HtmlUtils.htmlEscape(value == null ? "" : value, "UTF-8");
  }

  private static String singleLine(String value) {
    return value.replaceAll("[\\r\\n]+", " ").strip();
  }
}
