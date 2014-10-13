"""
The observation model for the Sana data engine.

:Authors: Sana dev team
:Version: 2.0
"""

from django.contrib.gis.db import models

class Observer(models.Model):
    """ The user who executes the Procedure and collects the Observations """

    class Meta:
        app_label = "dora"
    uuid = models.SlugField(max_length=36, unique=True, editable=False)
    """ A universally unique identifier """
    
    created = models.DateTimeField(auto_now_add=True)
    """ When the object was created """
    
    modified = models.DateTimeField(auto_now=True)
    """ updated on modification """

    user = models.TextField()
    """ A universally unique identifier. See  """

    
