"""
Notifications for the Sana data engine.

:Authors: Sana dev team
:Version: 2.0
"""
import json

from django.contrib.gis.db import models

class Notification(models.Model):
    """ A message to be sent """
    class Meta:
        app_label = "dora"
        
    uuid = models.SlugField(max_length=36, unique=True, editable=False)
    """ A universally unique identifier """
    
    created = models.DateTimeField(auto_now_add=True)
    """ When the object was created """
    
    modified = models.DateTimeField(auto_now=True)
    """ updated on modification """

    address = models.CharField(max_length=512)
    """ The recipient address """
    
    header = models.CharField(max_length=512)
    """ Short descriptive text; i.e. subject field """

    message = models.TextField()
    """ The message body """
    
    delivered = models.BooleanField(default = False)
    """ Set True when delivered """
    
    #TODO This is likely better moved elsewhere 
    def to_json(self, **kwargs):
        msg = {'address': self.client,
               'subject': self.header,
               'message': self.message,}
        for k,v in kwargs.iteritems():
            msg[k] = v
        return json.dumps(msg)
