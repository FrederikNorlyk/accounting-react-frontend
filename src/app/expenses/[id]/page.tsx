"use client"

import ExpenseClient from "@/clients/ExpenseClient";
import ExpenseForm from "./ExpenseForm";
import ExpenseFactory from "@/app/factories/ExpenseFactory";
import { redirect } from "next/navigation";

export default async function ExpensePage(param: any) {
  if (!param) return (
    <div>Loading</div>
  )

  const id = param.params.id
  const isAddMode = id == 0;

  var expense
  if (isAddMode) {
    expense = (new ExpenseFactory()).buildEmptyExpense()
  } else {
    const client = new ExpenseClient()
    expense = await client.get(id)
  }

  const onSubmitCallback = () => {
    redirect('/expenses')
  }

  return (
    <ExpenseForm expense={expense} onSubmitCallback={onSubmitCallback}/>
  );
}
