package com.procurex.notificationservice.service;

public interface EmailService {

    void sendVendorApproved(String toEmail, String vendorName);

    void sendRFQInvitation(String toEmail, String vendorName, String rfqNumber, String closingDate);

    void sendPOApproved(String toEmail, String vendorName,
                        String poNumber, String totalAmount, String expectedDelivery);

    void sendPaymentCompleted(String toEmail, String vendorName,
                              String invoiceNumber, String amount,
                              String transactionRef, String paymentMethod);
}
