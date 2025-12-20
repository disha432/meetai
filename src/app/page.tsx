"use client"; // this is a client component // this is required for using components that have interactivity

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client"; //import the auth client
import React from "react";

export default function Home() {
  const[name, setName] = React.useState("");
  const[email, setEmail] = React.useState("");
  const[password, setPassword] = React.useState("");

  const onSubmit = () =>{
     authClient.signUp.email({
      name,
      email,
      password
     },{
      onError:()=>{
        alert("Error signing up");
      },
      onSuccess:()=>{
        alert("Signed up successfully");
      }
     });
  }

  return(
    <div className="flex flex-col gap-4 p-4">
     <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
     <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
     <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
    
     <Button onClick={onSubmit}>Click Here</Button>
    
    </div>

  )
}
