export interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
    category: string;
    picture?: {
        data: {
            url: string;
        }
    }
}

export const FacebookService = {
    init: (appId: string): Promise<void> => {
        return new Promise((resolve) => {
            const doInit = () => {
                window.FB.init({
                    appId  : appId,
                    cookie : true,
                    xfbml  : true,
                    version: 'v21.0'
                });
                resolve();
            };

            if (window.FB) {
                doInit(); // Re-init with (possibly new) appId
                return;
            }

            window.fbAsyncInit = doInit;

            if (!document.querySelector('script[src*="connect.facebook.net"]')) {
                const script = document.createElement('script');
                script.src = "https://connect.facebook.net/en_US/sdk.js";
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
            }
        });
    },

    login: (): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!window.FB) return reject(new Error("Facebook SDK not initialized"));
            
            window.FB.login((response: any) => {
                if (response.authResponse) {
                    resolve(response.authResponse);
                } else {
                    reject(new Error('User cancelled login or did not fully authorize.'));
                }
            }, { scope: 'pages_show_list,pages_read_engagement,pages_manage_posts' });
        });
    },

    getPages: (): Promise<FacebookPage[]> => {
        return new Promise((resolve, reject) => {
            if (!window.FB) return reject(new Error("Facebook SDK not initialized"));

            window.FB.api('/me/accounts', { fields: 'id,name,access_token,category,picture' }, (response: any) => {
                if (response && !response.error) {
                    resolve(response.data);
                } else {
                    reject(response.error || new Error("Failed to fetch pages"));
                }
            });
        });
    },

    postToPage: (pageId: string, pageAccessToken: string, message: string, imageUrl?: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            if (!window.FB) return reject(new Error("Facebook SDK not initialized"));

            const endpoint = imageUrl ? `/${pageId}/photos` : `/${pageId}/feed`;
            const params: any = {
                access_token: pageAccessToken,
                message: message
            };
            
            if (imageUrl) {
                params.url = imageUrl;
            }

            window.FB.api(endpoint, 'POST', params, (response: any) => {
                if (response && !response.error) {
                    resolve(response);
                } else {
                    reject(response.error || new Error("Failed to post to page"));
                }
            });
        });
    }
};

declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: any;
    }
}
