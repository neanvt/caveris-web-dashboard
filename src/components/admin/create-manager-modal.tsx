"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { hashPassword } from "@/lib/password-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

const managerSchema = z.object({
  full_name: z.string().min(3, "Name must be at least 3 characters"),
  father_name: z.string().min(3, "Father's name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .length(10, "Phone number must be 10 digits"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

type ManagerFormValues = z.infer<typeof managerSchema>;

interface CreateManagerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateManagerModal({
  open,
  onClose,
  onSuccess,
}: CreateManagerModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: {
      full_name: "",
      father_name: "",
      email: "",
      phone: "",
      date_of_birth: "",
      address: "",
      city: "",
      password: "",
    },
  });

  const onSubmit = async (values: ManagerFormValues) => {
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Check if email already exists
      const { data: existingUsers } = await supabase
        .from("users")
        .select("email")
        .eq("email", values.email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Email Already Exists",
          description: "A user with this email already exists",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Generate UUID for the user
      const newUserId = crypto.randomUUID();

      // Hash the password with salt
      const { hash, salt } = await hashPassword(values.password);

      // Create user in users table with hashed password
      const { error: insertError } = await supabase.from("users").insert({
        id: newUserId,
        email: values.email,
        phone: values.phone,
        full_name: values.full_name,
        father_name: values.father_name,
        date_of_birth: values.date_of_birth,
        address: values.address,
        city: values.city,
        role: "manager",
        created_by: user.id,
        is_active: true,
        password_hash: hash,
        password_salt: salt,
      });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Manager Created Successfully",
        description: `${values.full_name} has been added as a manager`,
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating manager:", error);
      toast({
        title: "Failed to Create Manager",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create New Manager</DialogTitle>
          <DialogDescription>
            Add a new centre manager to supervise verification operations
          </DialogDescription>
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
                    <Input placeholder="Jane Smith" {...field} />
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
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="jane.smith@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Used for login and notifications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input placeholder="Mumbai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Minimum 8 characters with uppercase, lowercase, and number
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
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
                {isSubmitting ? "Creating..." : "Create Manager"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
