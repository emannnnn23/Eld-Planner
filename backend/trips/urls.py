from django.urls import path
from trips.views import plan_trip_view, health_check_view

urlpatterns = [
    path('plan-trip/', plan_trip_view, name='plan_trip'),
    path('health/', health_check_view, name='health_check'),
]
