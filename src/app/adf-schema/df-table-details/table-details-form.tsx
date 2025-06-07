"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Save, X, Code } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// Monaco Editor dynamic import to avoid SSR issues
const MonacoEditor = React.lazy(() => import("@/components/editors/monaco-editor"));

// Zod schema for table details validation
const tableDetailsSchema = z.object({
  name: z
    .string()
    .min(1, "Table name is required")
    .max(64, "Table name must be 64 characters or less")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Table name must start with a letter and contain only letters, numbers, and underscores"),
  alias: z
    .string()
    .max(64, "Alias must be 64 characters or less")
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Alias must start with a letter and contain only letters, numbers, and underscores")
    .optional()
    .or(z.literal("")),
  label: z
    .string()
    .max(255, "Label must be 255 characters or less")
    .optional()
    .or(z.literal("")),
  plural: z
    .string()
    .max(255, "Plural form must be 255 characters or less")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
    .or(z.literal("")),
});

// JSON schema for raw JSON editing
const jsonSchema = z.object({
  jsonContent: z.string().refine(
    (val) => {
      if (!val.trim()) return true; // Allow empty
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Must be valid JSON",
    }
  ),
});

type TableDetailsFormData = z.infer<typeof tableDetailsSchema>;
type JsonFormData = z.infer<typeof jsonSchema>;

interface TableDetailsFormProps {
  /** Current table data for edit mode */
  initialData?: Partial<TableDetailsFormData> & {
    field?: any[];
    related?: any[];
    access?: number;
    primaryKey?: string[];
    [key: string]: any;
  };
  /** Form mode - create or edit */
  mode?: "create" | "edit";
  /** Database name */
  dbName?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Success callback */
  onSuccess?: (data: any) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Cancel callback */
  onCancel?: () => void;
  /** Submit callback for form data */
  onSubmit?: (data: TableDetailsFormData | any, isJsonMode?: boolean) => Promise<void>;
  /** Custom validation errors */
  externalErrors?: Record<string, string>;
}

/**
 * React component implementing table metadata form using React Hook Form with Zod schema validation.
 * Handles table name, alias, label, plural, and description fields with real-time validation
 * and provides JSON editing mode via Monaco editor integration.
 * 
 * Key Features:
 * - React Hook Form with Zod schema validators for all user inputs
 * - Real-time validation under 100ms per React/Next.js Integration Requirements
 * - Tailwind CSS with consistent theme injection
 * - Monaco editor integration for JSON editing mode
 * - Responsive design with mobile-friendly layout
 * - Accessibility compliant with proper ARIA attributes
 * - Error handling with user-friendly messages
 * - Automatic form state management
 */
export function TableDetailsForm({
  initialData,
  mode = "create",
  dbName,
  isLoading = false,
  disabled = false,
  onSuccess,
  onError,
  onCancel,
  onSubmit,
  externalErrors = {},
}: TableDetailsFormProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"form" | "json">("form");
  const [jsonError, setJsonError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for table details
  const form = useForm<TableDetailsFormData>({
    resolver: zodResolver(tableDetailsSchema),
    defaultValues: {
      name: initialData?.name || "",
      alias: initialData?.alias || "",
      label: initialData?.label || "",
      plural: initialData?.plural || "",
      description: initialData?.description || "",
    },
    mode: "onChange", // Real-time validation
    reValidateMode: "onChange",
  });

  // Form state for JSON editing
  const jsonForm = useForm<JsonFormData>({
    resolver: zodResolver(jsonSchema),
    defaultValues: {
      jsonContent: initialData ? JSON.stringify(initialData, null, 2) : "",
    },
    mode: "onChange",
  });

  // Reset forms when initial data changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        alias: initialData.alias || "",
        label: initialData.label || "",
        plural: initialData.plural || "",
        description: initialData.description || "",
      });
      jsonForm.reset({
        jsonContent: JSON.stringify(initialData, null, 2),
      });
    }
  }, [initialData, form, jsonForm]);

  // Disable name field in edit mode
  useEffect(() => {
    if (mode === "edit") {
      form.setValue("name", initialData?.name || "", { shouldValidate: false });
    }
  }, [mode, initialData?.name, form]);

  // Handle form submission
  const handleFormSubmit = async (data: TableDetailsFormData) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    setJsonError("");

    try {
      let payload = data;

      // Add default field for create mode
      if (mode === "create") {
        payload = {
          ...data,
          field: [
            {
              alias: null,
              name: "id",
              label: "Id",
              description: null,
              native: [],
              type: "id",
              dbType: null,
              length: null,
              precision: null,
              scale: null,
              default: null,
              required: false,
              allowNull: false,
              fixedLength: false,
              supportsMultibyte: false,
              autoIncrement: true,
              isPrimaryKey: false,
              isUnique: false,
              isIndex: false,
              isForeignKey: false,
              refTable: null,
              refField: null,
              refOnUpdate: null,
              refOnDelete: null,
              picklist: null,
              validation: null,
              dbFunction: null,
              isVirtual: false,
              isAggregate: false,
            },
          ],
        };
      } else {
        // Add preserved fields for edit mode
        payload = {
          ...data,
          access: initialData?.access,
          primary_key: initialData?.primaryKey,
        };
      }

      await onSubmit(payload, false);
      onSuccess?.(payload);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("An error occurred");
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle JSON submission
  const handleJsonSubmit = async (data: JsonFormData) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    setJsonError("");

    try {
      const parsedData = JSON.parse(data.jsonContent);
      await onSubmit(parsedData, true);
      onSuccess?.(parsedData);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("JSON")) {
          setJsonError("Invalid JSON format");
        } else {
          setJsonError(error.message);
          onError?.(error);
        }
      } else {
        const err = new Error("An error occurred while processing JSON");
        setJsonError(err.message);
        onError?.(err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = disabled || isLoading || isSubmitting;

  return (
    <div className={cn(
      "w-full space-y-6",
      theme === "dark" ? "dark" : ""
    )}>
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as "form" | "json")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Table Details
          </TabsTrigger>
          <TabsTrigger value="json" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            JSON Editor
          </TabsTrigger>
        </TabsList>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === "create" ? "Create New Table" : "Edit Table"}
                {dbName && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    in {dbName}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                  {/* External errors alert */}
                  {Object.keys(externalErrors).length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {Object.values(externalErrors).join(", ")}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Table Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Table Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter table name"
                            disabled={isFormDisabled || mode === "edit"}
                            className="transition-all duration-200 focus:ring-2"
                            aria-describedby="name-description"
                          />
                        </FormControl>
                        <FormMessage />
                        <p id="name-description" className="text-xs text-muted-foreground">
                          Must start with a letter and contain only letters, numbers, and underscores
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Grid layout for alias and label */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alias Field */}
                    <FormField
                      control={form.control}
                      name="alias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Alias
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter alias"
                              disabled={isFormDisabled}
                              className="transition-all duration-200 focus:ring-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Label Field */}
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Label
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter display label"
                              disabled={isFormDisabled}
                              className="transition-all duration-200 focus:ring-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Plural Field */}
                  <FormField
                    control={form.control}
                    name="plural"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Plural Form
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter plural form"
                            disabled={isFormDisabled}
                            className="transition-all duration-200 focus:ring-2"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Used for API endpoint naming conventions
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter table description"
                            disabled={isFormDisabled}
                            rows={4}
                            className="transition-all duration-200 focus:ring-2 resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Detailed description of the table's purpose and usage
                        </p>
                      </FormItem>
                    )}
                  />

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isFormDisabled}
                      className="order-2 sm:order-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isFormDisabled || !form.formState.isValid}
                      className="order-1 sm:order-2 sm:ml-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting
                        ? "Saving..."
                        : mode === "create"
                        ? "Create Table"
                        : "Update Table"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JSON Tab */}
        <TabsContent value="json" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>JSON Editor</CardTitle>
              <p className="text-sm text-muted-foreground">
                Edit the table schema directly as JSON. Changes will override form values.
              </p>
            </CardHeader>
            <CardContent>
              <Form {...jsonForm}>
                <form onSubmit={jsonForm.handleSubmit(handleJsonSubmit)} className="space-y-6">
                  {/* JSON Error Alert */}
                  {jsonError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{jsonError}</AlertDescription>
                    </Alert>
                  )}

                  {/* Monaco Editor */}
                  <FormField
                    control={jsonForm.control}
                    name="jsonContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">JSON Content</FormLabel>
                        <FormControl>
                          <div className="border rounded-md overflow-hidden min-h-[400px]">
                            <React.Suspense
                              fallback={
                                <div className="flex items-center justify-center h-[400px] bg-muted">
                                  <div className="text-sm text-muted-foreground">
                                    Loading editor...
                                  </div>
                                </div>
                              }
                            >
                              <MonacoEditor
                                value={field.value}
                                onChange={field.onChange}
                                language="json"
                                theme={theme === "dark" ? "vs-dark" : "vs"}
                                height="400px"
                                options={{
                                  minimap: { enabled: false },
                                  lineNumbers: "on",
                                  roundedSelection: false,
                                  scrollBeyondLastLine: false,
                                  automaticLayout: true,
                                  tabSize: 2,
                                  insertSpaces: true,
                                  formatOnPaste: true,
                                  formatOnType: true,
                                  readOnly: isFormDisabled,
                                }}
                              />
                            </React.Suspense>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={isFormDisabled}
                      className="order-2 sm:order-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isFormDisabled || !jsonForm.formState.isValid}
                      className="order-1 sm:order-2 sm:ml-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting
                        ? "Saving..."
                        : mode === "create"
                        ? "Create from JSON"
                        : "Update from JSON"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TableDetailsForm;