import { browserClient } from "../common/client/browserClient";
import { BrowserService } from "../common/services/BrowserService";

class AuthBrowserService extends BrowserService {
    async updateDocumentNumber(documentNumber: string) {
        const { data } = await this.client.patch("/auth/profile/document", {
            documentNumber,
        });
        return data;
    }
}

const authService = new AuthBrowserService(browserClient);
export default authService;