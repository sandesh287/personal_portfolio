import type { PaginatedPayload } from "@/types/api";

export type MessageSource = "contact_form" | "communication_terminal" | "admin_test";
export type MessageSortField = "createdAt" | "name" | "email" | "subject";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  source: MessageSource;
  read: boolean;
  starred: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageReceipt {
  id: string;
  received: boolean;
}

export interface MessageCreatePayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  source?: MessageSource;
  website?: string;
}

export interface MessageUpdatePayload {
  read?: boolean;
  starred?: boolean;
  archived?: boolean;
}

export interface MessageListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  read?: boolean;
  archived?: boolean;
  starred?: boolean;
  sort?: MessageSortField;
  order?: "asc" | "desc";
}

export type MessageListResponse = PaginatedPayload<ContactMessage>;
