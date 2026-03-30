"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound } from "lucide-react";
import { hashPassword, generateDefaultPassword } from "@/lib/password-utils";

const editManagerSchema = z.object({
  full_name: z.string().min(3, "Name must be at least 3 characters"),
  father_name: z.string().min(3, "Father's name must be at least 3 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .length(10, "Phone number must be 10 digits"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  is_active: z.string(),
});

type EditManagerFormValues = z.infer<typeof editManagerSchema>;

interface Manager {
  id: string;
  full_name: string;
  father_name: string | null;
  email: string;
  phone: string;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
}

interface EditManagerModalProps {
  open: boolean;
  onClose: () => void;
  manager: Manager | null;
  onSuccess: () => void;
}

export function EditManagerModal({
  open,
  onClose,
  manager,
  onSuccess,
}: EditManagerModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const form = useForm<EditManagerFormValues>({
    resolver: zodResolver(editManagerSchema),
    defaultValues: {
      full_name: "",
      father_name: "",
      phone: "",
      date_of_birth: "",
      address: "",
      city: "",
      is_active: "true",
    },
  });

  useEffect(() => {
    if (manager) {
      form.reset({
        full_name: manager.full_name,
        father_name: manager.father_name || "",
        phone: manager.phone,
        date_of_birth: manager.date_of_birth || "",
        address: manager.address || "",
        city: manager.city || "",
        is_active: manager.is_active ? "true" : "false",
      });
    }
  }, [manager, form]);

  const onSubmit = async (values: EditManagerFormValues) => {
    if (!manager) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("users")
        .update({
          full_name: values.full_name,
          father_name: values.father_name,
          phone: values.phone,
          date_of_birth: values.date_of_birth,
          address: values.address,
          city: values.city,
          is_active: values.is_active === "true",
        })
        .eq("id", manager.id);

      if (error) throw error;

      toast({
        title: "Manager Updated Successfully",
        description: `${values.full_name} has been updated`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating manager:", error);
      toast({
        title: "Failed to Update Manager",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!manager) return;

    const confirmed = window.confirm(
      `Reset password for ${manager.full_name}?\n\nThis will set their password to the default (last 4 digits of phone + "Caveris") and prompt them to change it on next login.`
    );
    if (!confirmed) return;

    setIsResettingPassword(true);

    try {
      const supabase = createClient();

      // Generate default password from current phone
      const currentPhone = form.getValues("phone") || manager.phone;
      const defaultPassword = generateDefaultPassword(currentPhone);
      const { hash, salt } = await hashPassword(defaultPassword);

      const { error } = await supabase
        .from("users")
        .update({
          password_hash: hash,
          password_salt: salt,
          force_password_change: true,
        })
        .eq("id", manager.id);

      if (error) throw error;

      toast({
        title: "Password Reset Successfully",
        description: `${manager.full_name}'s password has been reset to the default. They will be prompted to change it on next login.`,
      });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Failed to Reset Password",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!manager) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Manager</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Father Name */}
            <FormField
              control={form.control}
              name="father_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Father's Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Robert Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email (Read-only) */}
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input value={manager.email} disabled className="bg-gray-50" />
              <FormDescription>Email cannot be changed</FormDescription>
            </FormItem>

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    10-digit Indian mobile number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter full address"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="is_active"
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
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
                disabled={isSubmitting || isResettingPassword}
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                {isResettingPassword ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Reset Password
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting || isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isResettingPassword}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Manager
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
