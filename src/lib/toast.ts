// import { toast as toastify } from "react-toastify";
import { toast as sonnerToast } from "sonner";

type result<T> = { result: T; successMessage: string; errorMessage: string };

export const handleTRPCMutation = async <T>(
  mutation: () => Promise<T>,
  successMessage: string,
  errorMessage = "An error occurred",
) => {
  const promise = new Promise<result<T>>((resolve, reject) => {
    mutation()
      .then((result) => {
        resolve({ result, successMessage, errorMessage });
      })
      .catch((error) => {
        if (error instanceof Error) {
          reject(new Error(`${errorMessage} (${error.message})`));
        } else {
          reject(new Error(errorMessage));
        }
      });
  });

  sonnerToast.promise(promise, {
    loading: "Loading...",
    success: (data: result<T>) => {
      return data.successMessage;
    },
    error: (data: Error) => {
      console.log(data);
      return data.message;
    },
  });
  return promise;
};