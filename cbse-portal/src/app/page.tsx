import fs from "fs";
import path from "path";
import ClientPage from "./ClientPage";
import { parseStudent, StudentRecord } from "@/lib/data";

export default async function Page() {
  const filePath = path.join(process.cwd(), "public", "results_data.json");
  const fileContents = fs.readFileSync(filePath, "utf8");
  const rawData: StudentRecord[] = JSON.parse(fileContents);
  
  const initialStudents = rawData
    .filter((r) => r.status === 200 && r.data)
    .map((r) => parseStudent(r.data));

  return <ClientPage initialStudents={initialStudents} />;
}
