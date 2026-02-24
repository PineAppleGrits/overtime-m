import { client } from "../common/client/baseClient";
import { Service } from "../common/services/Service";

class AuthService extends Service {
  async getProfile() {
    const { data } = await this.client.get("/auth/profile");
    return data;
  }

  async updateDocumentNumber(documentNumber: string) {
    const { data } = await this.client.patch("/auth/profile/document", {
      documentNumber,
    });
    return data;
  }
}

const authService = new AuthService(client);
export default authService;