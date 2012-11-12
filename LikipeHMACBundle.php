<?php

namespace Likipe\HMACBundle;

use Likipe\HMACBundle\Security\Factory\HMACFactory;
use Symfony\Component\HttpKernel\Bundle\Bundle;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class LikipeHMACBundle extends Bundle
{
	public function build(ContainerBuilder $container)
	{
		parent::build($container);
		
		$extension = $container->getExtension('security');
		$extension->addSecurityListenerFactory(new HMACFactory());
	}
}