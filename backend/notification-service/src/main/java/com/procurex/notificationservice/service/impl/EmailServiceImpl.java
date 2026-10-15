package com.procurex.notificationservice.service.impl;

import com.procurex.notificationservice.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender       mailSender;
    private final SpringTemplateEngine templateEngine;

    @Value("${app.mail.from:noreply@procurex.com}")
    private String fromAddress;

    @Value("${app.portal.url:http://localhost:5173}")
    private String portalUrl;

    @Override
    public void sendVendorApproved(String toEmail, String vendorName) {
        Context ctx = new Context();
        ctx.setVariable("vendorName", vendorName);
        ctx.setVariable("loginUrl", portalUrl + "/login");
        sendHtmlEmail(toEmail, "Your ProcureX Vendor Account is Approved", "vendor-approved", ctx);
    }

    @Override
    public void sendRFQInvitation(String toEmail, String vendorName,
                                   String rfqNumber, String closingDate) {
        Context ctx = new Context();
        ctx.setVariable("vendorName",  vendorName);
        ctx.setVariable("rfqNumber",   rfqNumber);
        ctx.setVariable("closingDate", closingDate);
        ctx.setVariable("portalUrl",   portalUrl + "/vendor/rfqs");
        sendHtmlEmail(toEmail, "New RFQ Invitation - " + rfqNumber, "rfq-invitation", ctx);
    }

    @Override
    public void sendPOApproved(String toEmail, String vendorName,
                                String poNumber, String totalAmount, String expectedDelivery) {
        Context ctx = new Context();
        ctx.setVariable("vendorName",       vendorName);
        ctx.setVariable("poNumber",         poNumber);
        ctx.setVariable("totalAmount",      totalAmount);
        ctx.setVariable("expectedDelivery", expectedDelivery);
        ctx.setVariable("portalUrl",        portalUrl + "/vendor/orders");
        sendHtmlEmail(toEmail, "Purchase Order " + poNumber + " Approved", "po-approved", ctx);
    }

    @Override
    public void sendPaymentCompleted(String toEmail, String vendorName,
                                      String invoiceNumber, String amount,
                                      String transactionRef, String paymentMethod) {
        Context ctx = new Context();
        ctx.setVariable("vendorName",    vendorName);
        ctx.setVariable("invoiceNumber", invoiceNumber);
        ctx.setVariable("amount",        amount);
        ctx.setVariable("transactionRef", transactionRef);
        ctx.setVariable("paymentMethod", paymentMethod);
        sendHtmlEmail(toEmail, "Payment Completed - " + invoiceNumber, "payment-completed", ctx);
    }

    private void sendHtmlEmail(String to, String subject, String templateName, Context ctx) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            String html = templateEngine.process(templateName, ctx);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email sent to {} subject: {}", to, subject);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Email send failed: " + e.getMessage(), e);
        }
    }
}
