import BlogForm from "../BlogForm"
export default async function EditBlogPage({params}:{params:Promise<{id:string}>}){return <BlogForm id={(await params).id}/>}
