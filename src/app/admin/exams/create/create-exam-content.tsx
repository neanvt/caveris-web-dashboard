"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createExam } from "@/lib/api/exam-api";
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
    is_testing: z.boolean().catch(false),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "End date must be after or equal to start date",
    path: ["end_date"],
  });

type ExamFormValues = z.infer<typeof examSchema>;

export function CreateExamContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      exam_name: "",
      exam_code: "",
      description: "",
      is_testing: false,
    },
  });

  const onSubmit = async (values: ExamFormValues) => {
    setIsSubmitting(true);

    try {
      // Call API to create exam
      const result = await createExam({
        examName: values.exam_name,
        examCode: values.exam_code,
        description: values.description || undefined,
        startDate: values.start_date.toISOString(),
        endDate: values.end_date.toISOString(),
        isTesting: values.is_testing,
      });

      toast({
        title: "Exam Created Successfully",
        description: `${values.exam_name} has been created`,
      });

      // Redirect to exams list
      router.push("/admin/exams");
    } catch (error: unknown) {
      console.error("Error creating exam:", error);
      toast({
        title: "Failed to Create Exam",
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
            <CardTitle className="text-3xl">Create New Exam</CardTitle>
            <CardDescription>
              Set up a new exam with basic details. You can add candidates and
              centres later.
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

                {/* Submit Buttons */}
                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/admin/exams")}
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
                    {isSubmitting ? "Creating..." : "Create Exam"}
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
