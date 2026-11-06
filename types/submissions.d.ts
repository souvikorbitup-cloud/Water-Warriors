import type {
  ContactStatus,
  FeedbackStatus,
  FeedbackTopic,
} from "@/lib/submissions/constants";

export type ContactListItem = {
  id: string;
  name: string;
  email: string;
  message: string;
  preview: string;
  status: ContactStatus;
  adminNote: string;
  handledBy: string | null;
  readAt: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackListItem = {
  id: string;
  topic: FeedbackTopic;
  rating: number;
  name: string;
  email: string;
  message: string;
  preview: string;
  isAnonymous: boolean;
  status: FeedbackStatus;
  adminNote: string;
  handledBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionsListResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unread: number;
};

export type ApiErrorBody = {
  message?: string;
  fieldErrors?: Record<string, string>;
};
