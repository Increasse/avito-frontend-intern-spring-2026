import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import '@mantine/core/styles.css';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider defaultColorScheme="auto">
                <RouterProvider router={router} />
            </MantineProvider>
        </QueryClientProvider>
    </React.StrictMode>
);