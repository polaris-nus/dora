'''
Created on Aug 9, 2012

:author: Sana Development Team
:version: 2.0
'''
from django.contrib.gis.db import models

QUEUE_STATUS=((0,'Failed Dispatch'))

class EncounterQueueElement(models.Model):
    """ An element that is being processed
    """

    class Meta:
        app_label = "dora"
    uuid = models.SlugField(max_length=36, unique=True, editable=False)
    """ A universally unique identifier """
    
    created = models.DateTimeField(auto_now_add=True)
    """ When the object was created """
    
    modified = models.DateTimeField(auto_now=True)
    """ updated on modification """

    object_url = models.CharField(max_length=512)
    """ The uuid of the cached object """
    
    @property
    def object_uuid(self):
        return ''
    
    cache = models.TextField(blank=True)
    """ Dump of the form data for the object """
    
    status = models.IntegerField(choices=QUEUE_STATUS)
    """ Current state in the queue """
    
    message = models.TextField(blank=True)
    """ Useful messages returned from processing """