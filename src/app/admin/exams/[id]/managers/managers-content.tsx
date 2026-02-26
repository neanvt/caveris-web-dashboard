"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react";

export function ExamManagersContent({ examId }: { examId: string }) {
  const router = useRouter();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/exams/${examId}` as any)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exam Details
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <CardTitle className="text-3xl">Exam Managers</CardTitle>
              <CardDescription>
                Assign managers to supervise this exam
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-12 text-center">
            <Users className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              Coming Soon
            </h3>
            <p className="mt-2 text-gray-600">
              Manager assignment functionality will be available here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
