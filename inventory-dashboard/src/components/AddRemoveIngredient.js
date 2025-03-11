import React from "react";
import { useMutation, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import { addIngredient, removeIngredient } from "../supabaseClient";

const AddRemoveIngredient = () => {
  const { register, handleSubmit, reset } = useForm();
  const queryClient = useQueryClient();

  const addMutation = useMutation(addIngredient, {
    onSuccess: () => {
      queryClient.invalidateQueries("ingredients");
      reset();
    },
  });

  const removeMutation = useMutation(removeIngredient, {
    onSuccess: () => queryClient.invalidateQueries("ingredients"),
  });

  return (
    <div className="p-4">

      <form onSubmit={handleSubmit(addMutation.mutate)} className="mb-4">
        <input {...register("barcode")} placeholder="ID" className="border p-2 w-full mb-2" required />
        <input {...register("ingredient_name")} placeholder="Name" className="border p-2 w-full mb-2" required />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
      </form>

      <form onSubmit={handleSubmit(({ barcode }) => removeMutation.mutate(barcode))}>
        <input {...register("barcode")} placeholder="ID" className="border p-2 w-full mb-2" required />
        <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded">Remove</button>
      </form>
    </div>
  );
};

export default AddRemoveIngredient;
