import { Chatbot } from '@/components/Chatbot';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Chatbot />
    </>
  );
};