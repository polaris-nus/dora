""" Represents a single step within a Procedure.

:Authors: Sana dev team
:Version: 2.0
"""

from django.contrib.gis.db import models

## ?Procedure step. First iteration
class Instruction(models.Model):
    
    class Meta:
        app_label = "dora"
    concept = models.ForeignKey('Concept', to_field='uuid')
    ''' Contextual information about the instruction '''
    
    predicate = models.CharField(max_length=64)
    ''' The predicate logic used for this instruction within a decision tree.'''
    
    algorithm = models.CharField(max_length=64)
    ''' The name of an algorithm used to calculate a score for the instruction.'''
    
    compound = models.BooleanField(default=False)
    ''' True if this Instruction has child instructions. '''

    boolean_operator = models.CharField(max_length=64, blank=True)
    ''' The logical operator to apply when evaluating children if compound.'''

    
    
    