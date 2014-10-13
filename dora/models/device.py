""" An entity that  acts as a tool for data collection.

:Authors: Sana dev team
:Version: 2.0
"""

from django.contrib.gis.db import models


class Device(models.Model):
    """ The entity which is used to collect the data """
    
    class Meta:
        app_label = "dora"
        
    uuid = models.SlugField(max_length=36, unique=True,editable=False)
    """ A universally unique identifier """
    
    created = models.DateTimeField(auto_now_add=True)
    """ When the object was created """
    
    modified = models.DateTimeField(auto_now=True)
    """ updated on modification """
           
    name = models.CharField(max_length=36)
    """ A display name """

