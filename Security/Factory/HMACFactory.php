<?php
namespace Likipe\HMACBundle\Security\Factory;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\DependencyInjection\DefinitionDecorator;
use Symfony\Component\Config\Definition\Builder\NodeDefinition;
use Symfony\Bundle\SecurityBundle\DependencyInjection\Security\Factory\SecurityFactoryInterface;

class HMACFactory implements SecurityFactoryInterface
{
	public function create(ContainerBuilder $container, $id, $config, $userProvider, $defaultEntryPoint)
	{
		$providerId = 'security.authentication.provider.hmac.'.$id;
		$container
			->setDefinition($providerId, new DefinitionDecorator('hmac.security.authentication.provider'))
			->replaceArgument(0, new Reference($userProvider))
		;
		
		$listenerId = 'security.authentication.listener.hmac.'.$id;
		$listener = $container->setDefinition($listenerId, new DefinitionDecorator('hmac.security.authentication.listener'))
			->replaceArgument(3, new Reference($config['nonceValidatorService']));
		
		return array($providerId, $listenerId, $defaultEntryPoint);
	}
	
	public function getPosition()
	{
		return 'pre_auth';
	}
	
	public function getKey()
	{
		return 'hmac';
	}
	
	public function addConfiguration(NodeDefinition $node)
	{
		$node->children()
			->scalarNode('nonceValidatorService')
			->end();
	}
}