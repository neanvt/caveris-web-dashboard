"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2 } from "lucide-react";

const centreSchema = z.object({
  centre_name: z.string().min(1, "Centre name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(6, "Valid pincode is required"),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z
    .string()
    .email("Valid email is required")
    .optional()
    .or(z.literal("")),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  is_active: z.boolean(),
});

type CentreFormValues = z.infer<typeof centreSchema>;

interface Centre {
  id: string;
  centre_name: string;
  centre_code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  capacity: number;
  is_active: boolean;
}

interface EditCentreModalProps {
  open: boolean;
  onClose: () => void;
  centre: Centre;
}

export function EditCentreModal({
  open,
  onClose,
  centre,
}: EditCentreModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<CentreFormValues>({
    resolver: zodResolver(centreSchema),
    defaultValues: {
      centre_name: centre.centre_name,
      address: centre.address,
      city: centre.city,
      state: centre.state,
      pincode: centre.pincode,
      contact_person: centre.contact_person || "",
      contact_phone: centre.contact_phone || "",
      contact_email: centre.contact_email || "",
      capacity: centre.capacity,
      is_active: centre.is_active,
    },
  });

  useEffect(() => {
    form.reset({
      centre_name: centre.centre_name,
      address: centre.address,
      city: centre.city,
      state: centre.state,
      pincode: centre.pincode,
      contact_person: centre.contact_person || "",
      contact_phone: centre.contact_phone || "",
      contact_email: centre.contact_email || "",
      capacity: centre.capacity,
      is_active: centre.is_active,
    });
  }, [centre, form]);

  const onSubmit = async (values: CentreFormValues) => {
    try {
      setLoading(true);

      const { updateCentre } = await import("@/app/actions/supabase-actions");
      const result = await updateCentre(centre.id, values);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Centre updated successfully",
      });

      onClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update centre";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Centre</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="centre_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Centre Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Centre Code</label>
                <Input
                  value={centre.centre_code}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">
                  Centre code cannot be changed
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select
                    value={field.value ? "true" : "false"}
                    onValueChange={(value) => field.onChange(value === "true")}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Centre
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
