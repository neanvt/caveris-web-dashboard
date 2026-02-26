"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getExam, updateExam } from "@/app/actions/supabase-actions";

const examSchema = z
  .object({
    exam_name: z.string().min(3, "Exam name must be at least 3 characters"),
    exam_code: z
      .string()
      .min(2, "Exam code must be at least 2 characters")
      .regex(
        /^[A-Z0-9-]+$/,
        "Only uppercase letters, numbers, and hyphens allowed",
      ),
    start_date: z.date(),
    end_date: z.date(),
    description: z.string().optional(),
    status: z.enum(["draft", "scheduled", "ongoing", "completed", "cancelled"]),
    is_testing: z.boolean().catch(false),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be after or equal to start date",
    path: ["end_date"],
  });

type ExamFormValues = z.infer<typeof examSchema>;

export function EditExamContent({ examId }: { examId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      exam_name: "",
      exam_code: "",
      description: "",
      status: "draft",
      is_testing: false,
    },
  });

  const loadExam = useCallback(async () => {
    try {
      const { data, error } = await getExam(examId);

      if (error) throw new Error(error);

      if (data) {
        form.reset({
          exam_name: data.exam_name,
          exam_code: data.exam_code,
          description: data.description || "",
          status: data.status,
          is_testing: data.is_testing || false,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
        });
      }
    } catch (error) {
      console.error("Error loading exam:", error);
      toast({
        title: "Failed to Load Exam",
        description: "Could not load exam details",
        variant: "destructive",
      });
      router.push("/admin/exams");
    } finally {
      setLoading(false);
    }
  }, [examId, form, router, toast]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const onSubmit = async (values: ExamFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await updateExam(examId, {
        exam_name: values.exam_name,
        exam_code: values.exam_code,
        description: values.description || null,
        start_date: format(values.start_date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        end_date: format(values.end_date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        status: values.status,
        is_testing: values.is_testing,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Exam Updated Successfully",
        description: `${values.exam_name} has been updated`,
      });

      // Redirect to exams list
      router.push("/admin/exams");
    } catch (error: unknown) {
      console.error("Error updating exam:", error);
      toast({
        title: "Failed to Update Exam",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Back Button */}
      <div className="w-full max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/exams")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exams
        </Button>
      </div>

      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Edit Exam</CardTitle>
            <CardDescription>
              Update exam details and change status. You can change status from
              draft to scheduled when ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Exam Name */}
                <FormField
                  control={form.control}
                  name="exam_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., UPSC Civil Services 2026"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Full name of the exam as it will appear on reports
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Exam Code */}
                <FormField
                  control={form.control}
                  name="exam_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., UPSC-2026"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier (uppercase letters, numbers, hyphens
                        only)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Change to &quot;Scheduled&quot; when exam is ready to
                        begin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Testing Mode Checkbox */}
                <FormField
                  control={form.control}
                  name="is_testing"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Testing Exam</FormLabel>
                        <FormDescription>
                          Mark this exam as a testing exam for verifier practice
                          and training. Testing exams are used only for practice
                          and won&apos;t affect real verification data.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Date Fields in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>First day of the exam</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Date */}
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date <
                                (form.getValues("start_date") || new Date())
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Last day of the exam</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional details about the exam..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional notes or instructions for this exam
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Buttons */}
                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isSubmitting ? "Updating..." : "Update Exam"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
