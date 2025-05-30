import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PayPalConfig } from '../../config/paypal.config';
import * as paypal from '@paypal/payouts-sdk';

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private client = PayPalConfig.client();

  async sendPayout(recipientEmail: string, amount: number, currency: string = 'USD') {
    try {
      const requestBody = {
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: 'You have a payout!',
          email_message: 'You have received a payout from our platform!'
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: amount.toString(),
              currency: currency
            },
            receiver: recipientEmail,
            note: 'Withdrawal from wallet',
            sender_item_id: `item_${Date.now()}`
          }
        ]
      };

      // Correct way to create the request
      const request = new paypal.payouts.PayoutsPostRequest();
      request.requestBody(requestBody);

      const response = await this.client.execute(request);
      
      // Log the full response to debug
      this.logger.log('PayPal payout response:', JSON.stringify(response.result, null, 2));
      
      // Check if response structure is as expected
      if (!response.result || !response.result.batch_header) {
        throw new Error('Invalid PayPal response structure');
      }

      const batchId = response.result.batch_header.payout_batch_id;
      const batchStatus = response.result.batch_header.batch_status;
      
      // Handle items array safely
      let payoutItemId = null;
      if (response.result.items && response.result.items.length > 0) {
        payoutItemId = response.result.items[0].payout_item_id;
      }

      this.logger.log(`PayPal payout sent successfully: ${batchId}`);

      return {
        batchId: batchId,
        status: batchStatus,
        payoutItemId: payoutItemId
      };
    } catch (error) {
      this.logger.error('PayPal payout failed:', error);
      
      // Log more details about the error
      if (error.response) {
        this.logger.error('PayPal API Error Response:', JSON.stringify(error.response, null, 2));
      }

      // Better error handling with more specific error messages
      if (error.statusCode) {
        throw new BadRequestException(`PayPal payout failed (${error.statusCode}): ${error.message}`);
      }

      throw new BadRequestException(`PayPal payout failed: ${error.message || 'Unknown error'}`);
    }
  }

  async getPayoutStatus(payoutBatchId: string) {
    try {
      const request = new paypal.payouts.PayoutsGetRequest(payoutBatchId);
      const response = await this.client.execute(request);

      // Log the response for debugging
      this.logger.log('PayPal status response:', JSON.stringify(response.result, null, 2));

      // Safely handle the response structure
      const result = {
        batchId: response.result?.batch_header?.payout_batch_id || payoutBatchId,
        status: response.result?.batch_header?.batch_status || 'UNKNOWN',
        items: response.result?.items || []
      };

      return result;
    } catch (error) {
      this.logger.error('Failed to get payout status:', error);

      if (error.statusCode) {
        throw new BadRequestException(`Failed to get payout status (${error.statusCode}): ${error.message}`);
      }

      throw new BadRequestException(`Failed to get payout status: ${error.message || 'Unknown error'}`);
    }
  }
}