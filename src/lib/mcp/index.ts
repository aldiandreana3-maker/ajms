import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyBillsTool from "./tools/list-my-bills";
import searchDataTokenTool from "./tools/search-data-token";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "andrea-jarrdin-management-system",
  title: "Andrea Jarrdin Management System",
  version: "0.1.0",
  instructions: "Gunakan alat AJMS untuk membaca tagihan pengguna dan mencari data token listrik sesuai hak akses akun yang terhubung.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMyBillsTool, searchDataTokenTool],
});