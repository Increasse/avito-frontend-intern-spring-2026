import { createBrowserRouter, Navigate } from 'react-router-dom';
import AdsListPage from './pages/AdsListPage';
import AdDetailPage from './pages/AdDetailPage';
import AdEditPage from './pages/AdEditPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/ads" replace />,
    },
    {
        path: 'ads',
        element: <AdsListPage />,
    },
    {
        path: 'ads/:id',
        element: <AdDetailPage />,
    },
    {
        path: 'ads/:id/edit',
        element: <AdEditPage />,
    },
    {
        path: '*',
        element: <Navigate to="/ads" replace />,
    },
]);