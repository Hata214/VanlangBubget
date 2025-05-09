import 'next-intl';

declare module 'next-intl' {
    export interface Messages {
        app: {
            name: string;
            description: string;
        };
        home: {
            hero: {
                title: string;
                description: string;
                getStarted: string;
                learnMore: string;
            };
            cta: {
                title: string;
                description: string;
                getStarted: string;
                contact: string;
            };
        };
        navigation: {
            dashboard: string;
            incomes: string;
            expenses: string;
            loans: string;
        };
        auth: {
            login: string;
            register: string;
            forgotPassword: string;
            resetPassword: string;
            email: string;
            password: string;
            confirmPassword: string;
            fullName: string;
            rememberMe: string;
            dontHaveAccount: string;
            alreadyHaveAccount: string;
            createAccount: string;
            demoAccount: string;
            loginError: string;
            backToHome: string;
        };
    }
} 