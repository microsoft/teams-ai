import { sendMailGraph } from './graphHelper';

export const sendMail = async (senderUserId: string, subject: string, body: string, recipient: string) => {
    try {
        console.log('Sending mail...');
        await sendMailGraph(senderUserId, subject, body, recipient);
        console.log(`Mail sent to ${recipient}`);
    } catch (err) {
        console.log(`Error sending mail: ${err}`);
    }
};
