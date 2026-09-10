from django.contrib import admin
from django.urls import path, include
from trips.views import health_check_view

urlpatterns = [
    path('', health_check_view, name='root_health'),
    path('admin/', admin.site.urls),
    path('api/', include('trips.urls')),
]
