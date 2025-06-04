'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form';

// Email template validation schema
const emailTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Email template name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  to: z.string()
    .max(255, 'To field must be less than 255 characters')
    .optional(),
  cc: z.string()
    .max(255, 'CC field must be less than 255 characters')
    .optional(),
  bcc: z.string()
    .max(255, 'BCC field must be less than 255 characters')
    .optional(),
  subject: z.string()
    .max(255, 'Subject must be less than 255 characters')
    .optional(),
  attachment: z.string()
    .max(500, 'Attachment path must be less than 500 characters')
    .optional(),
  body: z.string()
    .max(10000, 'Body must be less than 10,000 characters')
    .optional(),
  senderName: z.string()
    .max(100, 'Sender name must be less than 100 characters')
    .optional(),
  senderEmail: z.string()
    .email('Please enter a valid sender email address')
    .or(z.literal(''))
    .optional(),
  replyToName: z.string()
    .max(100, 'Reply-to name must be less than 100 characters')
    .optional(),
  replyToEmail: z.string()
    .email('Please enter a valid reply-to email address')
    .or(z.literal(''))
    .optional(),
});

type EmailTemplateFormData = z.infer<typeof emailTemplateSchema>;

interface EmailTemplate {
  id: number;
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyText?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
  defaults?: any;
  createdDate: string;
  lastModifiedDate: string;
  createdById?: number;
  lastModifiedById?: number;
}

interface EmailTemplatePayload {
  name: string;
  description?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  attachment?: string;
  bodyHtml?: string;
  fromName?: string;
  fromEmail?: string;
  replyToName?: string;
  replyToEmail?: string;
}

// Mock API client functions (these would be implemented in separate API client)
const apiClient = {
  async getEmailTemplate(id: string): Promise<EmailTemplate> {
    // This would be replaced with actual API call to DreamFactory
    const response = await fetch(`/api/v2/system/email_template/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch email template: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  async updateEmailTemplate(id: string, payload: EmailTemplatePayload): Promise<EmailTemplate> {
    // This would be replaced with actual API call to DreamFactory
    const response = await fetch(`/api/v2/system/email_template/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-DreamFactory-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Failed to update email template: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmailTemplateEditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate | null>(null);

  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(emailTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      attachment: '',
      body: '',
      senderName: '',
      senderEmail: '',
      replyToName: '',
      replyToEmail: '',
    },
  });

  // Fetch email template data on component mount
  useEffect(() => {
    async function fetchEmailTemplate() {
      try {
        setIsLoading(true);
        setError('');
        
        const template = await apiClient.getEmailTemplate(resolvedParams.id);
        setEmailTemplate(template);
        
        // Pre-populate form with existing data
        form.reset({
          name: template.name || '',
          description: template.description || '',
          to: template.to || '',
          cc: template.cc || '',
          bcc: template.bcc || '',
          subject: template.subject || '',
          attachment: template.attachment || '',
          body: template.bodyHtml || '',
          senderName: template.fromName || '',
          senderEmail: template.fromEmail || '',
          replyToName: template.replyToName || '',
          replyToEmail: template.replyToEmail || '',
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load email template';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmailTemplate();
  }, [resolvedParams.id, form]);

  async function onSubmit(data: EmailTemplateFormData) {
    try {
      setIsSubmitting(true);
      setError('');

      const payload: EmailTemplatePayload = {
        name: data.name,
        description: data.description || '',
        to: data.to || '',
        cc: data.cc || '',
        bcc: data.bcc || '',
        subject: data.subject || '',
        attachment: data.attachment || '',
        bodyHtml: data.body || '',
        fromName: data.senderName || '',
        fromEmail: data.senderEmail || '',
        replyToName: data.replyToName || '',
        replyToEmail: data.replyToEmail || '',
      };

      await apiClient.updateEmailTemplate(resolvedParams.id, payload);
      
      // Navigate back to email templates list
      router.push('/system-settings/email-templates');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update email template';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    router.push('/system-settings/email-templates');
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Edit Email Template
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            Update the email template configuration and content.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-6">
            <Alert.Icon />
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
            <Alert.Dismiss onClick={() => setError('')} />
          </Alert>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
          <div className="px-4 py-6 sm:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Template Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                        Template Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter template name"
                          className="w-full"
                          aria-describedby="name-error"
                        />
                      </FormControl>
                      <FormMessage id="name-error" />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter template description"
                          className="w-full"
                          aria-describedby="description-error"
                        />
                      </FormControl>
                      <FormMessage id="description-error" />
                    </FormItem>
                  )}
                />

                {/* Recipients Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                          To Recipients
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="recipient@example.com"
                            className="w-full"
                            aria-describedby="to-error"
                          />
                        </FormControl>
                        <FormMessage id="to-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                          CC Recipients
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="cc@example.com"
                            className="w-full"
                            aria-describedby="cc-error"
                          />
                        </FormControl>
                        <FormMessage id="cc-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bcc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                          BCC Recipients
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="bcc@example.com"
                            className="w-full"
                            aria-describedby="bcc-error"
                          />
                        </FormControl>
                        <FormMessage id="bcc-error" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Subject */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                        Subject
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter email subject"
                          className="w-full"
                          aria-describedby="subject-error"
                        />
                      </FormControl>
                      <FormMessage id="subject-error" />
                    </FormItem>
                  )}
                />

                {/* Attachment */}
                <FormField
                  control={form.control}
                  name="attachment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                        Attachment Path
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Path to attachment file"
                          className="w-full"
                          aria-describedby="attachment-error"
                        />
                      </FormControl>
                      <FormMessage id="attachment-error" />
                    </FormItem>
                  )}
                />

                {/* Body */}
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                        Email Body (HTML)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter email body content (HTML supported)"
                          className="min-h-[120px] w-full"
                          aria-describedby="body-error"
                        />
                      </FormControl>
                      <FormMessage id="body-error" />
                    </FormItem>
                  )}
                />

                {/* Sender Information Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="senderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                          Sender Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Sender's display name"
                            className="w-full"
                            aria-describedby="senderName-error"
                          />
                        </FormControl>
                        <FormMessage id="senderName-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="senderEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                          Sender Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="sender@example.com"
                            className="w-full"
                            aria-describedby="senderEmail-error"
                          />
                        </FormControl>
                        <FormMessage id="senderEmail-error" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Reply-To Information Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="replyToName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                          Reply-To Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Reply-to display name"
                            className="w-full"
                            aria-describedby="replyToName-error"
                          />
                        </FormControl>
                        <FormMessage id="replyToName-error" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="replyToEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                          Reply-To Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="replyto@example.com"
                            className="w-full"
                            aria-describedby="replyToEmail-error"
                          />
                        </FormControl>
                        <FormMessage id="replyToEmail-error" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-x-3 border-t border-gray-900/10 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-3 py-2 text-sm font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                    className="px-3 py-2 text-sm font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Updating...
                      </>
                    ) : (
                      'Update Template'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}