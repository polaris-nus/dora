''' sana.dora.models.location

:author: Sana Development Team
:version: 2.0
:copyright: Sana 2012, released under BSD New License(http://sana.mit.edu/license)
'''

from django.contrib.gis.db import models

class Location(models.Model):
    
    class Meta:
        app_label = "dora"
        
    uuid = models.SlugField(max_length=36, unique=True, editable=False)
    """ A universally unique identifier """
    
    name = models.CharField(max_length=255)
    """A label for identifying the location"""
    
    def __unicode__(self):
        return self.name