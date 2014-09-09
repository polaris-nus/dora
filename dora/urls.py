from django.conf.urls import patterns, include, url

from dora.views import index

urlpatterns = patterns('',
    # Examples:
    url(r'^$', index),
    #url(r'^admin/', include(admin.site.urls)),
)
