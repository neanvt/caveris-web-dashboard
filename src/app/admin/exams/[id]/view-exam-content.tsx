"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Calendar, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Exam {
  id: string;
  exam_name: string;
  exam_code: string;
  status: string;
  start_date: string;
  end_date: string;
  description: string;
  created_at: string;
}

export function ViewExamContent({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  const loadExam = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", examId)
        .single();

      if (error) throw error;
      setExam(data);
    } catch (error) {
      console.error("Error loading exam:", error);
      router.push("/admin/exams");
    } finally {
      setLoading(false);
    }
  }, [examId, router]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-purple-100 text-purple-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="p-6">
        <p>Exam not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/admin/exams")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exams
          </Button>
          <Button
            onClick={() => router.push(`/admin/exams/${examId}/edit`)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Exam
          </Button>
        </div>

        {/* Exam Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{exam.exam_name}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  {exam.exam_code}
                </CardDescription>
              </div>
              <span
                className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusColor(exam.status)}`}
              >
                {exam.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Description */}
            {exam.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Description
                </h3>
                <p className="text-gray-900">{exam.description}</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Start Date
                </h3>
                <p className="text-lg text-gray-900">
                  {format(new Date(exam.start_date), "MMMM dd, yyyy")}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  End Date
                </h3>
                <p className="text-lg text-gray-900">
                  {format(new Date(exam.end_date), "MMMM dd, yyyy")}
                </p>
              </div>
            </div>

            {/* Created At */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Created
              </h3>
              <p className="text-gray-900">
                {format(new Date(exam.created_at), "MMMM dd, yyyy 'at' h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Candidates</CardTitle>
              <CardDescription>Manage exam candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/exams/${examId}/candidates`)}
              >
                View Candidates
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Centres</CardTitle>
              <CardDescription>Manage exam centres</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/exams/${examId}/centres`)}
              >
                View Centres
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verifiers</CardTitle>
              <CardDescription>Assign verifiers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/exams/${examId}/verifiers`)}
              >
                Assign Verifiers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Managers</CardTitle>
              <CardDescription>Assign managers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push(`/admin/exams/${examId}/managers`)}
              >
                Assign Managers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
