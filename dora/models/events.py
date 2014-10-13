"""
Created on Feb 29, 2012

:Authors: Sana dev team
:Version: 2.0
"""
import json
from django.contrib.gis.db import models
from django.conf import settings
from django.utils.translation import ugettext_lazy as _

# TODO read this from the config
TIME_FORMAT = "%m/%d/%Y %H:%M:%S"

class Event(models.Model):
    """
    Logging facility for requests.
    """
    class Meta:
        app_label = "dora"
    uuid = models.SlugField(max_length=36, unique=True, editable=False)
    """ A universally unique identifier """
    
    created = models.DateTimeField(auto_now_add=True)
    """ When the object was created """
    
    modified = models.DateTimeField(auto_now=True)
    """ updated on modification """

    # max keylength of index is 767
    client = models.CharField(max_length=16)
    """ Client which made the request. """
    
    path = models.CharField(max_length=64)
    """ """
    
    level = models.IntegerField()
    """ The max level of messages attached to this log. """
    
    name = models.CharField(max_length=767)
    """ The view name, or path,  of the logged target. """
    
    messages = models.TextField()
    """ JSON encoded message list """
    
    duration = models.FloatField()
    
    def settimestamp(self, value):
        self.created = value
    
    def gettimestamp(self):
        return self.created
            
    timestamp = property(fset=settimestamp, fget=gettimestamp)
    
    def getmessage(self):
        try:
            return json.loads(self.messages)
        except:
            return self.messages
        
    def setmessage(self, value):
        self.level = json.dumps(value, True)
        
    message = property(fget=getmessage, fset=setmessage)
        
    def __unicode__(self):
        """ Default output """
        return "%6s%12s%12s%s" % (self.level, self.client, self.path, 
                    self.timestamp.strftime(settings.TIME_FORMAT))


