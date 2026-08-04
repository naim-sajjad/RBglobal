import JobForm from "../JobForm"
export default async function EditJobPage({params}:{params:Promise<{id:string}>}){return <JobForm id={(await params).id}/>}
