import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Workshop = Tables<"workshops">;
export type Registration = Tables<"registrations">;
export type Feedback = Tables<"feedback">;

export async function fetchUpcomingWorkshops(limit?: number) {
  let query = supabase
    .from("workshops")
    .select("*")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchWorkshop(id: string) {
  const { data, error } = await supabase.from("workshops").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchRegistrationCounts() {
  const { data, error } = await supabase.rpc("workshop_registration_counts");
  if (error) throw error;
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.workshop_id as string, Number(row.registration_count));
  }
  return map;
}

export function formatWorkshopDate(value: string) {
  return new Date(value).toLocaleString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const provinces = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];
