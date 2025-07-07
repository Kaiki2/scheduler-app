import { getAuth } from "firebase/auth";

export async function getIdToken() {
  const user = getAuth().currentUser;
  return user ? await user.getIdToken() : null;
}
