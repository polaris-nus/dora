from django.conf.urls import patterns, include, url
from mds.dora.views import *

urlpatterns = patterns('',
    # Examples:
    url(r'^$', index),
    url(r'^query/', query),
    #url(r'^admin/', include(admin.site.urls)),
    url(r'^savequery/', save_query),
    url(r'^deletequery/', delete_query),
    url(r'^loadqueries/', load_saved_queries),
)
