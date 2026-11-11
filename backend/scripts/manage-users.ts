/**
 * Kullanim:
 *   npm run add-user -- <kullanici-adi> <sifre> [admin|operator]
 *   npm run remove-user -- <kullanici-adi>
 *   npm run list-users
 */
import bcrypt from "bcryptjs";
import { addUser, removeUser, loadUsers } from "../src/users";

const [, , cmd, ...args] = process.argv;

async function main() {
  if (cmd === "add") {
    const [username, password, role = "operator"] = args;
    if (!username || !password) {
      console.error("Kullanim: npm run add-user -- <kullanici-adi> <sifre> [admin|operator]");
      process.exit(1);
    }
    if (role !== "admin" && role !== "operator") {
      console.error('role "admin" veya "operator" olmali');
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    addUser({ username, passwordHash, role, addedAt: new Date().toISOString() });
    console.log(`"${username}" eklendi (${role}).`);
  } else if (cmd === "remove") {
    const [username] = args;
    const ok = removeUser(username);
    console.log(ok ? `"${username}" silindi.` : `"${username}" bulunamadi.`);
  } else if (cmd === "list") {
    const users = loadUsers();
    if (users.length === 0) {
      console.log("Kayitli kullanici yok.");
    } else {
      for (const u of users) {
        console.log(`- ${u.username} (${u.role}) — eklenme: ${u.addedAt}`);
      }
    }
  } else {
    console.error("Bilinmeyen komut. add | remove | list kullan.");
    process.exit(1);
  }
}

main();
