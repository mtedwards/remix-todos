import { json, redirect } from "@remix-run/node";
import { Form,  useLoaderData, useTransition } from "@remix-run/react";
import { useEffect, useRef } from "react";
import supabase from "../utils/initSupabase";


// Get the initial data from Supabase
export async function loader() {
  // Get the data from Supabase
  const { data } = await supabase.from("todos").select("id, title, completed");
  return json({
    allTodos: data,
  })
}


// Forms submisstions.
export async function action({ request }) {
  const data = Object.fromEntries(await request.formData());
  
  if (request.method.toLowerCase() === "post") {
    // Add a Todo to Supabase
    await supabase.from("todos").insert([{ title: data.newTodo }]);
  } else if (request.method.toLowerCase() === "put") {
    // Update a Todo in Supabase (Completed state)
    await supabase.from("todos").update( { completed: data.completed }).match({ id: data.id });
  } else if (request.method.toLowerCase() === "delete") {
    // Delete a Todo in Supabase
    await supabase.from("todos").delete().match({ id: data.id });
  }

  // reload the page.
  return redirect("/");
}

// Render the page.
export default function Index() {

  const { allTodos } = useLoaderData();

  // updated by form state.
  let transition = useTransition();
  let busy = transition.state === "submitting" && transition.submission.formData.get("_action") === "addTodo";


  // Reset the form to a blank state when the form is submitted
  let formRef = useRef();
   useEffect(() => {
     if(!busy) {
       formRef.current.reset();
     }
   }, [busy])

  // output
  return ( 
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4", maxWidth: "800px", marginLeft:'auto', marginRight: "auto" }}>
      <h1>My Todos</h1>
      
      <ul className="todo-list" style={{dispay:"flex", flexDirection:"column", padding:0 }}>
        {allTodos.map((todo) => (
          <li key={todo.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              margin: 0,
              padding: 5,
              background: "#eee",
              border: "1px solid #111"
            }}
          >
            {todo.completed ? <strike>{todo.title}</strike> : todo.title}
            <span className="controls"
              style={{
                display: "flex",
                gap: 5
              }}>
              <Form replace method="put">
                  <input type="hidden" name="completed" value={!todo.completed} />
                  <input type="hidden" name="id" value={todo.id} />
                  <button type="submit" className="complete">{todo.completed ? <>&#8592;</> : <>&#10004;</>}</button>
              </Form>
              <Form replace method="delete">
                  <input type="hidden" name="id" value={todo.id} />
                  <button type="submit">&#10060;</button>
              </Form>
            </span>
          </li>
        ))}

      </ul>

      <Form method="post" ref={formRef} style={{marginTop: "1rem", display: "flex", gap: 10}} >
        <input type="text" name="newTodo" style={{padding:10}}/>
        <button disabled={busy} type="submit" name="_action" value="addTodo" style={{padding:10}}>{busy ? "Adding..." : "Add New Todo"}</button>
      </Form>
    </div>
  );
}
